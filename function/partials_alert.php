<?php if (!empty($errors)) { ?>
    <div class="alert error">
        <strong>Data belum valid:</strong>
        <ul>
            <?php foreach ($errors as $error) { ?>
                <li><?php echo h($error); ?></li>
            <?php } ?>
        </ul>
    </div>
<?php } ?>

<?php if (!empty($success)) { ?>
    <div class="alert success"><?php echo h($success); ?></div>
<?php } ?>
